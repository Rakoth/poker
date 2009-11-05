class AddAwayFromToPlayers < ActiveRecord::Migration
  def self.up
    add_column :players, :away_from, :datetime
  end

  def self.down
    remove_column :players, :away_from
  end
end
